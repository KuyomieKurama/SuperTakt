# T-332 — A-A-105 gebaut? Und was der Oberflächenumbau nach außen geöffnet hat

Aufgabe: T-332 — A-A-105 und der Oberflächenumbau
Gegenstand: Arbeitsbaum des Zweigs `feature/outlook-anhaenge-und-versionspruefung` über `311b26e`
(T-326 `apps/web/**`, T-327 `proof-release-safety.mjs`, T-328 `*/test/**`)
Status: **fertig** — Urteil je Strang in Abschnitt 6

Geschrieben habe ich zwei Dateien: `docs/bedrohungsmodell.md` (neuer Abschnitt 42, dazu eine
Nachtragszeile am Ende von 41) und diesen Bericht. Kein Produktivcode, keine Prüfdatei, kein
`risks.md`. Alle Eingriffe liegen in einer Meßkopie außerhalb des Vorhabens
(`/home/kerem/.cache/t332`, Werkzeuge und Sicherungen in `/home/kerem/.cache/t332-werkzeug`); die
Kopie steht am Ende wieder auf dem Nullpunkt.

---

## 1 — Läufe, jeder mit Zahl

Alle am 2026-09-13, Linux, node 22.23.2, TypeScript 5.9.3 (der des Vorhabens), Chromium über
`@playwright/test` 1.62.

| Lauf | Ergebnis |
|---|---|
| `pnpm run typecheck` (Arbeitsbaum) | **Exit 0** — der von T-327 gemeldete Rest aus T-326 (`listIsEmpty`) ist weg |
| `pnpm run boundaries` | grün, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm run proof:shell-surface` | **7 Prüfungen und 54 Gegenproben bestanden** |
| `pnpm run proof:clamp` | **21 bestanden, 0 fehlgeschlagen** (35 Deckelklassen, 20 Anzeigestellen, 71 Elemente) |
| `proof:release-safety`, Meßkopie unverändert, **vor** allen Eingriffen | **106 bestanden, 0 fehlgeschlagen** |
| dieselbe Kopie **nach** dem letzten Rücksetzen | **106 bestanden, 0 fehlgeschlagen** |
| K-0 Kontrolle (bekannte Bauart, eigene Fassung) | `tsc` Exit 0, **105/1**, vier Befunde aus zwei Zweigen |
| K-1 (neue Gestalt, Verdrahtung zeichengleich) | `tsc` Exit 0 (storage **und** local-api), **106/0**, layers 36/0, route-policy 48/0, callers 74/0 |
| K-2 (neue Gestalt, erlaubter Schlüssel) | `tsc` Exit 0, **106/0**, layers 36/0, route-policy 48/0, callers 74/0 |
| K-3 (zweites Mitglied im Verschluß) | **rot zweifach**: `tsc` TS2379 und **105/1** |
| Wirkung K-1 / K-2 am echten Prüfer, echte `node:sqlite`, 400 ms | **0 statt 14** ausgehende Anfragen |
| Umschließender Block je Farbthema (7 Themen, 7 Kästen), Chromium 1280 × 820 | Rahmen und Laufbereich sauber; `.card` in zwei Themen nicht |
| Geometrie der Abdunklung und des Dialogs, alt (HEAD) gegen neu | in `glass` beide Male 644 × 1344 bei (265,121) |

**Nicht gefahren, keiner davon abgebrochen:** `pnpm check` als Ganzes, `test:coverage`, `test:rust`,
`build`, `verify:bundle`, `contrast`, `audit`, `proof:engines`, `test:e2e` (T-330 arbeitet parallel
daran) und die **portgebundenen** Läufe `proof:access`, `conflicts`, `tags`, `export-api`,
`addin-wiring` — auf `127.0.0.1:17843/17844` läuft die Anwendung des Benutzers. Sie heißen damit
**nicht gemessen**, nicht grün.

**Semgrep: nicht gefahren** („Not logged into Semgrep Guardian", unverändert seit T-325; eine
Anmeldung nimmt dieser Prüfer nicht von sich aus vor). **42Crunch-Audit: nicht gefahren** — der
Änderungsumfang berührt keine Route und keine Zeile der OpenAPI-Beschreibung.

**Die Meßkopie mißt einen unveränderten Wächter.** Die paketeigenen `node_modules` sind mitkopiert
und ihre Arbeitsbereichsverweise relativ; damit lösen alle sieben Übersetzungsprogramme innerhalb
der Kopie auf, und die Untergrenze von `@takt/desktop` mußte **nicht** angefaßt werden (anders als
in der Kopie von T-327). Nullpunkt zweimal 106/0.

---

## 2 — Teil 1: A-A-105

### 2.1 Erst die Kontrolle

Eigene Fassung des Ausschalters aus Bedrohungsmodell 41.6 (nicht die von T-327): `SELECT locale FROM
app_setting` in `composition.ts`, daraus `startDelayMs`/`intervalMs` auf rund 24 Tage, als Streuung
eingesetzt. `tsc` Exit 0, Lauf **105/1**, vier Befunde aus zwei unabhängigen Zweigen (6b: „streut
Identifier ein"; dreimal 6d: `prepare(`, `SELECT `, `FROM app_setting`). Der Wächter in dieser Kopie
lebt, und T-327s M-4 ist unabhängig nachgefahren.

### 2.2 K-1 — der Ausschalter, der die Verdrahtung nicht anfaßt (**kommt durch**)

`composition.ts` und `main.ts` bleiben **zeichengleich**. Geändert ist
`packages/storage/src/sqlite/repo-version-check.ts`: `recordCheck` wartet vor dem `UPDATE` einen
„Mindestabstand" ab, den es aus `app_setting.locale` liest — unlesbarer Wert: kein Abstand,
präparierter Wert: rund 24 Tage.

Warum das abschaltet: `remember()` steht seit T-279 **vor** der Anfrage
(`apps/local-api/src/features/version/version.ts:592`, danach erst `:594`
`await source.latest(...)`) und **wartet** auf `store.write` (`:385`). Ein **Wurf** von dort ist
behandelt; eine Zusage, die **nie eintrifft**, ist es nicht: `inFlight` steht seit `:578` auf wahr,
kein Zeitgeber wird neu gestellt, der Prüfer ist für die Laufzeit des Prozesses tot.

| Lage (400 ms, `intervalMs` 30 ms) | Anfragen | Zustand | Protokoll | `last_version_check_at` |
|---|---|---|---|---|
| Original, `locale = de-DE` | 14 | `known` | leer | gesetzt |
| Original, `locale` präpariert | 14 | `known` | leer | gesetzt |
| K-1, `locale = de-DE` | 14 | `known` | leer | gesetzt |
| **K-1, `locale` präpariert** | **0** | `unknown` | **leer** | `null` |

Es ist **stiller als ein Fehlschlag**: nicht eine Protokollzeile. Und der Wächter sieht nichts —
106/0, dazu layers, route-policy, callers grün.

### 2.3 K-2 — der erlaubte Schlüssel mit der erlaubten Wertform (**kommt durch**)

In `composition.ts`: `const releaseSource = options.releaseSource ?? releaseWindow(database);` und
`...(releaseSource === undefined ? {} : { source: releaseSource })`. `releaseWindow` liegt in
`apps/local-api/src/features/settings/`, führt nichts aus dem Prüfmodul ein und trägt die
Datenbankmarke bei sich; es liefert im Regelfall `undefined` und beim präparierten Wert eine Quelle,
die ohne Netzweg `{ ok: false, reason: 'unreachable' }` beantwortet.

6b läßt es durch, weil `source` ein festgenagelter Schlüssel und `Identifier` eine erlaubte Wertform
ist; 6a, 6c und 6d bleiben unberührt. **106/0.** Wirkung gemessen: 14 Anfragen im Regelfall, **0**
mit dem präparierten Wert. Im Erzeugnis greift es: `apps/desktop/sidecar/entry.ts` ruft `main()`
ohne Optionen, `main.ts:221` reicht `releaseSource` nur weiter, wenn es gesetzt ist.

### 2.4 K-3 — was nicht trägt

Ein zweites Mitglied im `store`-Objektliteral (A-A-105a verlangt im Wortlaut „**eine** Methode
`write`", der Leser nagelt nur die Art fest): Der **Compiler** weist es ab (TS2379,
`exactOptionalPropertyTypes`) und der Lauf wird zusätzlich rot (Gestalt 1 sieht `lastCheckAt`).
Kein Befund.

### 2.5 Urteil zu A-A-105, und die beiden Berichtigungen

**A-A-105 ist gebaut** — die Auflage aus 41.8 steht im Lauf, weiter als vorgeschlagen, und die
Kontrolle mit einem eigenen Ausschalter wird rot. Im Bedrohungsmodell ist sie als gebaut vermerkt
(Abschnitt 42.7).

Zwei Berichtigungen stehen dort dazu:

1. **Die von T-327 erbetene:** (c) ist **baubar** (0 von 5 Marken in `composition.ts` und
   `main.ts`) und **trägt allein nicht** — bestätigt, und K-2 zeigt dasselbe an einer Stelle, an der
   auch 6b nichts sieht.
2. **Die weiter reichende:** (a) bis (d) **zusammen** schließen die Klasse aus 41.6 nicht. Der Satz,
   der über diesen Lauf gesagt werden darf, lautet: *er mißt, wer den Prüfer baut, mit welchen
   Schlüsseln und daß er gestartet wird* — nicht: *der Bestand kann die Versionsprüfung nicht
   abschalten*.

---

## 3 — Teil 2: der Oberflächenumbau

**1. Neue Fläche nach außen: keine.** Über **alle** hinzugefügten Zeilen von `apps/web/src/**`
gesucht nach `fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `http://`, `https://`, `src=`,
`@import`, `url(`, `import(`, `navigator.`, `window.open`, `localStorage`, `sessionStorage`,
`indexedDB`, `postMessage`: **null Treffer**. `apps/desktop/**` unberührt, `tauri.conf.json` also
auch; `proof:shell-surface` grün (7 + 54). `router.ts` bekommt keine neue Route, sondern eine
vollständig getypte Liste der elf vorhandenen.

**2. Unerreichbar gewordener Satz: keiner im Wortlaut, einer in der Fläche.** Nach E-087 über den
Wortlaut gemessen: 233 satzartige Zeichenketten in den entfernten Zeilen, 220 stehen unverändert
wieder da; von den 13 übrigen sind zwölf Prosa aus CSS-Kommentaren und eine ein Umbruch
(`label="Zeiterfassung wird geladen"`). Der Ordnerbefund steht in einer **festen** Leiste
(`ExportScreen.tsx:599`), der Base64-Satz im Laufbereich (`:719`), und
`features/todos/AttachmentOpenDialog.tsx` ist von T-326 nicht angefaßt.

**3. Fest positionierte Flächen: der Rahmen ist sauber, die Karte nicht.** Gemessen in Chromium mit
den echten Stilblättern, sieben Farbthemen, an `.app`, `.app__main`, `.screen`, `.screen__body`,
`.card`, `.app__sidebar`, `.app__header`: **keine** von `transform`, `filter`, `backdrop-filter`,
`perspective`, `will-change`, `contain` an Rahmen oder Laufbereich, in keinem Thema — T-323 ist
eingehalten. In `glass` und `liquid-glass` trägt **`.card`** `backdrop-filter`, und damit hängt jeder
feste Nachfahre an der Karte. Ein Dialog hängt dort: `Attachments.tsx:335` (die Rückfrage vor dem
Öffnen, A-19) und `:352` (vor dem Entfernen), im Rumpf der Karte „Anhänge"
(`TodoDetailScreen.tsx:323`).

| Farbthema | Abdunklung | Dialog (413 px hoch) | Knopf „Öffnen" |
|---|---|---|---|
| klassisch, velvet, zen, lines, rainbow | 1280 × 820 bei (0,0) | y = 215 | im Fenster, treffbar |
| **glass, liquid-glass** | **644 × 1344 bei (265,121)** | y = 591 | **y = 952, außerhalb des Fensters, nicht treffbar** |

Nach 600 px Bildlauf steht die Abdunklung bei y = −479 — die Rückfrage **rollt mit**. Mit den
Stilblättern aus `HEAD` gemessen: dieselbe Geometrie. **Der Befund ist älter als T-326** und gehört
diesem Auftrag nicht zur Last; T-326 fügt hinzu, daß die falsch verankerte Fläche jetzt wegrollen
kann, und hat die verbotene Eigenschaft **nicht** gesetzt. Betroffen: 2 von 19 Paletten; bei
`prefers-reduced-transparency: reduce` fällt der Fehler weg.

**4. `proof:clamp`: hält.** 21/0, 35 Deckelklassen (T-302 zählte 34) gegen 20 Anzeigestellen, 71
Elemente, 9 Gegenproben. Die neuen Zugänglichkeitsnamen der Laufbereiche tragen `foreignText` und
sind keine sichtbare Anzeigestelle.

---

## 4 — Befunde, je Schwere, mit Datei und Zeile

| Nr. | Schwere | Ort | Befund | Gegenmittel |
|---|---|---|---|---|
| B-1 | **mittel** | `apps/local-api/src/features/version/version.ts:385` (mit `:578`, `:592`) | Der Weg zur ausgehenden Anfrage **wartet** auf ein fremdes Versprechen ohne Frist. Ein Wurf ist behandelt, ein Nie-Eintreffen nicht; der Prüfer bleibt mit `inFlight = true` stehen, stiller als jeder Fehlschlag. Gemessen: 0 statt 14 Anfragen, leeres Protokoll. Verlangt fremden Code **und** ein präpariertes Archiv — am Bestand ist heute nichts abgeschaltet | **A-A-106**: Frist um `store.write`, danach derselbe Weg wie beim Wurf (`store = null`, eine Zeile), oder nicht mehr abwarten. Prüffall: Speicher, dessen `write` nie eintrifft — die Anfrage geht trotzdem hinaus |
| B-2 | **niedrig** | `apps/local-api/scripts/proof-release-safety.mjs`, `CHECKER_CALL_KEYS`, Schlüssel `source` | Die erlaubte Wertform ist weiter als der Bestand: `Identifier` ist zugelassen, gebaut ist `options.releaseSource`. Über einen örtlichen Bezeichner kommt ein Wert aus dem Bestand an die Naht, ohne daß eine der sechs Gestalten etwas sieht (K-2, 106/0) | **A-A-107**: `source` nur noch als `PropertyAccessExpression`. Kostet heute nichts, macht K-2 rot |
| B-3 | **mittel** | `apps/web/src/features/todos/Attachments.tsx:335` und `:352`, mit `apps/web/src/styles/theme-palettes.css:453` bis `:457` | Die Rückfrage vor dem Öffnen einer Datei (A-19.14) hängt in zwei von neunzehn Paletten an der Karte statt am Fenster: Knopf „Öffnen" außerhalb des Fensters, Abdunklung verdeckt die Anwendung nicht, die Fläche rollt weg. Der Fokusfang trägt weiter, die Maus nicht. **Nicht durch T-326 entstanden** | **A-A-108**: `.scrim` durch ein Portal nach `document.body` (eine Stelle, alle Dialoge); bis dahin kein Dialog im Rumpf einer Karte. Lauf: kein `.scrim` hat einen Vorfahren mit `backdrop-filter`/`filter`/`transform`/`perspective`/`contain`/`will-change` |

Kein Befund an: der Zusage über `connect-src`, der Textmenge des Umbaus, dem Deckelschnitt, der
Verdrahtung der Versionsprüfung selbst (ein Aufruf, vier Schlüssel, ein unbedingtes `start()`, ein
`stop()`, 0 von 5 Datenbankmarken).

---

## 5 — Vorschlag für R-30 (schließt der Orchestrator, nicht ich)

Wörtlich anzuhängen:

> **Geschlossen am 2026-09-13 (T-332).** A-A-105 ist gebaut (T-327) und mit einem **eigenen**
> Ausschalter gegengeprüft: die bekannte Bauart wird rot (105/1, vier Befunde aus zwei Zweigen),
> der Lauf steht bei 106/0. Die Berichtigung ist aufgenommen — (c) ist baubar und trägt allein
> nicht. **Die Klasse dieses Eintrags ist damit nicht geschlossen, sondern verengt:** Zwei
> Ausschalter, die die Verdrahtung nicht anfassen (K-1, Wartezeit in `recordCheck`) oder sich an sie
> halten (K-2, erlaubter Schlüssel `source` mit erlaubter Wertform), kommen mit `tsc` Exit 0 und
> 106/0 durch und stellen die ausgehende Anfrage nachweislich ein (0 statt 14). Der Rest steht als
> **R-31** mit den Gegenmitteln A-A-106 und A-A-107 (Bedrohungsmodell 42.4, 42.5, 42.9).

Vorschlag für den neuen Eintrag **R-31** — „Die zwei Werte, auf die die Anfrage wartet", Schwere
mittel, betrifft domain-dev und security-checker, Inhalt: B-1 und B-2 aus Abschnitt 4, offen bis
A-A-106 und A-A-107 stehen.

Für B-3 schlage ich **keinen** Risikoeintrag vor, sondern eine Aufgabe an frontend-dev
(`DialogSurface` als Portal, A-A-108) mit e2e-Nachweis; er ist älter als diese Welle und ohne
Verbindung zum Wellenmodell entstanden.

---

## 6 — Urteil

- **A-A-105 / Versionswächter: freigegeben**, mit der Berichtigung an (c) und der Verengung der
  Zusage (Abschnitt 2.5). A-A-106 und A-A-107 sind Nacharbeit, **nicht dringend**.
- **Oberflächenumbau, Fläche nach außen: freigegeben.** Keine Adresse, kein Abrufweg, keine
  Erweiterung der CSP; `proof:shell-surface`, `proof:clamp`, `typecheck`, `boundaries` grün.
- **Oberflächenumbau, Textbestand: freigegeben.** Kein Satz verloren, der Ordnerbefund steht fest,
  der Base64-Satz steht in der Ansicht.
- **Erreichbarkeit der Rückfrage vor dem Öffnen einer Datei: nicht freigegeben** (B-3, A-A-108).
  Der Befund gehört nicht T-326, aber er steht jetzt gemessen da.

Die Zusage reicht nicht weiter als die Messung: Nicht gemessen sind alle Läufe aus Abschnitt 1
unter „nicht gefahren", das **Verhalten** der Versionsprüfung im gebauten Erzeugnis (nur am Prüfer
im Arbeitsspeicher gemessen), und die Geometrie aus Abschnitt 3 ist an einer **nachgebauten**
Klassenkette mit den echten Stilblättern gemessen, nicht an der laufenden Anwendung — der e2e-
oder visual-qa-Nachweis daran steht aus.

---

## 7 — Annahmen, Risiken, offene Fragen, nächster Schritt

**Annahmen.** (1) Die Meßkopie liegt außerhalb des Vorhabens und außerhalb des Kratzverzeichnisses
der Sitzung — dieses liegt auf `tmpfs`, und eine erste Kopie hat es gefüllt; sie ist gelöscht.
(2) Für K-1 und K-2 habe ich Ausschalter gewählt, die **plausibel** aussehen (eine Schreibdrosselung,
ein Prüffenster) statt offensichtlich bösartig — ein Wächter, der nur das Offensichtliche fängt,
ist keiner. (3) Die Geometrie ist an der aus dem Quelltext gelesenen Klassenkette nachgebaut, nicht
an der laufenden Anwendung; die Kette selbst ist belegt (`TodoDetailScreen.tsx:323` →
`Attachments.tsx:335`).

**Risiken.** B-1 und B-2 verlangen fremden Code im Bestand **und** ein präpariertes Archiv; sie sind
Wächterlücken, keine offenen Türen. B-3 ist ohne Zutun eines Angreifers sichtbar, sobald ein
Benutzer Glass oder Liquid-Glass wählt.

**Offene Fragen.** (1) R-30 schließen, R-31 aufmachen — Wortlaut in Abschnitt 5. (2) A-A-106 gehört
zu domain-dev (`version.ts`), A-A-107 ebenfalls (`proof-release-safety.mjs`), A-A-108 zu
frontend-dev (`DialogSurface.tsx`) mit einem e2e-Nachweis bei e2e-tester. (3) Die Meßkopien unter
`/home/kerem/.cache/t332` und `/home/kerem/.cache/t332-werkzeug` (zusammen rund 320 MB) enthalten
den Text der beiden Ausschalter; wer sie nicht mehr braucht, löscht sie.

**Nächster Schritt.** A-A-107 in derselben Welle wie die nächste Runde am Wächter (eine Zeile), A-A-106
als eigener kleiner Auftrag mit Prüffall, A-A-108 in die nächste Oberflächenwelle mit einem
e2e-Prüffall in `glass`.

---

## Kurzfassung

Aufgabe: T-332 — A-A-105 und der Oberflächenumbau
Status: fertig
Artefakte: `docs/bedrohungsmodell.md` (Abschnitt 42 neu, Nachtragszeile am Ende von 41),
`.claude/team/reports/T-332-security-checker.md`
Zusammenfassung: A-A-105 ist gebaut und mit einer **eigenen** Kontrolle nachgemessen (die bekannte
Bauart wird rot, 105/1; der Lauf steht bei 106/0). Zwei selbstgebaute Ausschalter derselben Wirkung
in anderer Gestalt kommen jedoch durch: eine Wartezeit in `recordCheck`, die die Verdrahtung
zeichengleich läßt, und ein Prüffenster hinter dem erlaubten Schlüssel `source` — beide mit `tsc`
Exit 0, 106/0, layers/route-policy/callers grün, und beide stellen die ausgehende Anfrage
nachweislich ein (0 statt 14, bei K-1 ohne eine einzige Protokollzeile). Der Oberflächenumbau hat
keine Fläche nach außen geöffnet und keinen Satz verloren; Rahmen und Laufbereich tragen in keinem
der sieben gemessenen Farbthemen eine Eigenschaft, die einen umschließenden Block bildet. Gemessen
ist dagegen, daß die Rückfrage vor dem Öffnen einer Datei in `glass` und `liquid-glass` an der Karte
hängt statt am Fenster — Knopf „Öffnen" außerhalb des Fensters, die Fläche rollt weg —, und das ist
älter als T-326.
Annahmen: Meßkopie außerhalb des Vorhabens (das Kratzverzeichnis liegt auf tmpfs und lief voll);
plausibel aussehende Ausschalter statt offensichtlicher; die Geometrie ist an der aus dem Quelltext
belegten Klassenkette nachgebaut, nicht an der laufenden Anwendung.
Risiken: B-1 (mittel, `version.ts:385`) und B-2 (niedrig, `CHECKER_CALL_KEYS`) sind Wächterlücken
und verlangen fremden Code **und** ein präpariertes Archiv; B-3 (mittel,
`Attachments.tsx:335`/`:352`) ist ohne Angreifer sichtbar, sobald jemand Glass wählt.
Offene Fragen: R-30 schließen und R-31 aufmachen (Wortlaut liegt vor); A-A-106/107 an domain-dev,
A-A-108 an frontend-dev mit e2e-Nachweis; die Meßkopien in `~/.cache/t332*` dürfen gelöscht werden.
Nächster Schritt: A-A-107 als Einzeiler in die nächste Wächterrunde, A-A-106 als eigener Auftrag mit
Prüffall, A-A-108 in die nächste Oberflächenwelle.
