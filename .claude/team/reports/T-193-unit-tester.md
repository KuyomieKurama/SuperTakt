# T-193 — Eine Regel, die an zwei Orten wohnt und an keinem gemessen ist

**Rolle:** unit-tester **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`
**Gelesen:** `.claude/team/reports/T-186-frontend-dev.md` (vollständig, inkl. Nachtrag),
`.claude/team/board.md` (Einträge O-GS, O-GR), `apps/web/src/lib/touched.ts`,
`apps/web/src/components/FormDialog.tsx#TextField`, `apps/web/src/components/ConfirmDialog.tsx`,
`apps/web/src/screens/TemplatesScreen.tsx`, `apps/web/scripts/proof-foreign.mjs` (Bauart-Vorbild),
`vitest.config.ts`.

---

## Kurzfassung

```
Aufgabe: T-193 — O-GS (touched.ts ungemessen), O-GR (beginCopy ungemessen), Welle-AC-Bausteine
Status: fertig
```

Drei neue Prüfdateien, alle grün gegen den heutigen Bestand und alle mit belegtem Rot-vor-Grün:
`touched.test.ts` mißt Regel P-8 in fünf Fällen inklusive der Nachtrags-Schärfung „ein `onChange`
ist eine Eingabe", `templatesScreenBeginCopy.test.ts` mißt die von T-186 als „verhaltensgleich,
aber ungemessen" gemeldete Zusammenlegung, und `liveRegionsAlwaysRendered.test.ts` mißt die vier
in T-186 Abschnitt 7.2(c) gemeldeten Live-Regionen, die frontend-dev in dieser Welle inzwischen
bereits behoben hat. Kein Produktivcode angefaßt; zwei zeitlich begrenzte, checksummenbelegte
Rückbauten (`TemplatesScreen.tsx`, `touched.ts`, die vier Live-Region-Dateien) dienten nur der
Rot-Messung und sind exakt wiederhergestellt. Ein Befund unterwegs: das eigene Testfile löste
zunächst einen `jsdom`-Ladefehler aus, weil sein Kopfkommentar zufällig die Zeichenkette
„`@vitest-environment jsdom`" enthielt — Vitest scannt jede Datei danach, unabhängig davon, ob die
Fundstelle in einem Kommentar steht. Behoben durch Umformulierung.

---

## 1. O-GS — `touched.ts`, fünf Fälle

### Warum diese fünf, und nicht mehr

Der Auftrag nennt vier Pflichtfälle; ich habe einen fünften ergänzt (kein `trim()`), weil er eine
im Kopfkommentar von `touched.ts` explizit benannte Entscheidung sichert, die sonst an keiner
Stelle geprüft war. Alle fünf sind reine Aufrufe der exportierten Funktion `touchedOnBlur` — ohne
Rendern, ohne Bauteil, damit die Regel und nicht die heutige Verdrahtung gemessen wird.

| # | Fall | Erwartung | vor T-186 grün? |
|---|---|---|---|
| 1 | Öffnen, Tabulator hindurch, kein Zeichen getippt (`edited=false`, `value=""`) | `false` | **Nein — rot.** Das ist O-FY selbst: vor T-186 setzte jedes Verlassen `touched` bedingungslos. |
| 2 | Etwas getippt, dann verlassen (`edited=true`, `value="Kunden Nord"`) | `true` | Ja, grün. Mißt die Behebung nicht allein — zeigt nur, daß sie den erreichbaren Weg nicht verbaut hat. |
| 3 | Getippt und wieder gelöscht, ohne zwischendurch zu verlassen (`edited=true`, `value=""`) | `true` | Ja, grün vor T-186 (jedes Verlassen zählte zufällig richtig) — **aber rot unter der ersten T-186-Fassung** (Wertvergleich mit dem Öffnungswert, vor der Nachtrags-Schärfung). Das ist der eigentliche Meßfall dieser Zeile. |
| 4 | Vorbelegtes Feld (Bearbeiten), unverändert verlassen (`edited=false`, `value="Kunden Nord"`) | `true` | Ja, grün. Sichert P-8s zweite Hälfte, keine Behebung dieser Aufgabe. **Siehe Abschnitt 1.1 — Abweichung vom Auftragstext.** |
| 5 | Ein Leerzeichen als einziger Inhalt, nicht editiert (`edited=false`, `value=" "`) | `true` | Ja, grün. Sichert die dokumentierte Entscheidung „kein `trim()`". |

Jeder Fall trägt im Test einen Kommentar mit derselben Aussage, dazu zwei kleine Vergleichsfunktionen
(`wieVorT186`, `ersteT186Fassung`) — keine Mutmaßung, sondern ausführbare Modelle der beiden
Vorfassungen, gegen die die Erwartung jedes Falls tatsächlich läuft.

### 1.1 Eine Abweichung vom Wortlaut des Auftrags, bewußt nicht stillschweigend angepaßt

Der Auftrag nennt Fall 4 als „→ nicht angefaßt". Die tatsächliche, im Kopfkommentar von
`touched.ts` als Teil von P-8 dokumentierte Regel sagt etwas anderes: „... nur, wenn der Wert
sich seit dem Öffnen geändert hat **oder nicht leer ist**." Ein vorbelegtes, unverändertes,
nicht-leeres Feld ist nicht leer — es **gilt als berührt** (`touchedOnBlur` liefert `true`), bleibt
aber **stumm**, weil die Meldung an der Aufrufstelle zusätzlich einen leeren Wert verlangt. Beide
Lesarten führen zum selben sichtbaren Ergebnis (keine Meldung), aber nur eine davon ist der
tatsächliche Rückgabewert der Funktion, die dieser Prüffall mißt.

Ich habe die Erwartung **nicht** auf `false` gesetzt, um den Auftragstext wörtlich zu erfüllen —
das wäre E-087 in Reinform: eine Erwartung anpassen, damit ein Lauf grün wird, obwohl sie der
dokumentierten, verbindlichen Regel (P-8, T-184 Z-20) widerspricht. Getestet ist die Funktion, wie
sie ist und wie sie dokumentiert ist; die Abweichung von der Kurzfassung im Auftrag steht hier
als offene Frage an den Orchestrator (Abschnitt „Offene Fragen").

### 1.2 Rot-vor-Grün, tatsächlich gefahren (nicht nur behauptet)

`touched.ts` ist eine neue, unversionierte Datei (`git status`: `??`) — es gibt keine committete
Vorfassung, gegen die ich testen könnte. Statt dessen zwei Mutationsläufe, jeweils mit Sicherung
vorher und Wiederherstellung mit Prüfsummenvergleich danach:

1. `touchedOnBlur` auf `return true;` gesetzt (das Modell von „vor T-186"): **genau Fall 1** wird
   rot (`expected true to be false`), die anderen vier bleiben grün — exakt die in der Tabelle
   behauptete Trennschärfe.
2. `touchedOnBlur` auf `return value.length > 0;` gesetzt (die Schärfung zurückgenommen): **genau
   Fall 3** wird rot (`expected false to be true`), die anderen vier bleiben grün.

Beide Male `md5sum` vorher/nachher gleich nach Wiederherstellung. Ohne diese zwei Mutationen wäre
die Tabellenspalte „vor T-186 grün?" eine Behauptung gewesen statt eine Messung.

---

## 2. O-GR — `TemplatesScreen.beginCopy`, verhaltensgleich gemessen statt behauptet

### 2.1 Warum keine gerenderte Komponente

`beginCopy` ist eine private Closure, nicht exportiert. Eine Messung durch Rendern und Klicken
bräuchte `jsdom` und eine Rendering-Bibliothek (`@testing-library/react` o. ä.). Geprüft:

```
find node_modules/.pnpm -maxdepth 1 -iname "jsdom*"              → nichts
find node_modules/.pnpm -maxdepth 1 -iname "*testing-library*"   → nichts
```

`vitest.config.ts` bestätigt es im Kommentar: `environment: 'node'`, eine Browserumgebung müßte
jede Datei einzeln anfordern — und selbst dann bräche der Lauf mit einem Lademodulfehler ab
(`Cannot find package 'jsdom'`), nicht mit einem roten Fall. Beides einzurichten ist eine
`package.json`-Änderung — Hoheit des Orchestrators (CLAUDE.md, „Verzeichnisse und Hoheit").

### 2.2 Was statt dessen gemessen ist

Ein echter Syntaxbaum (`typescript`, dieselbe Bauart wie `proof-foreign.mjs`), vier Fälle:

1. `beginCopy` existiert als **eine** Funktion.
2. Diese eine Funktion setzt in ihrem Rumpf genau je einmal `setCopyName` (mit dem Vorschlag
   `` `Kopie von ${dropHiddenCharacters(<param>.name)}` `` — der Parametername wird aus der
   Funktionssignatur gelesen, nicht angenommen), `setCopyNameTouched(false)` und `setCopyDialog`
   mit demselben Parameter.
3. Der erste Einstieg (`onCopy`-Eigenschaft der Vorlagenliste) übergibt die **Kennung** `beginCopy`
   — keine eigene Fassung daneben.
4. Der zweite Einstieg (Knopf „Kopie anlegen") ruft **dieselbe** Funktion mit `shown` auf.
5. Der Vorschlagstext „Kopie von …" steht nur an **einer** Stelle in der Datei.

Zwei Aufrufe derselben Funktion mit demselben Argument erzeugen zwangsläufig dasselbe Ergebnis —
das ist keine Vermutung über Laufzeitverhalten, sondern eine Eigenschaft von Funktionsaufrufen.
Was eine Zusammenlegung brechen kann (ein Aufrufer behält seine eigene Fassung, ein Zustand fehlt,
der falsche Parameter wird durchgereicht), ist damit erfaßt.

### 2.3 Rot-vor-Grün, gegen den echten Vorzustand

`TemplatesScreen.tsx` ist gegenüber `HEAD` verändert (`git status`: `M`). `git show
HEAD:apps/web/src/screens/TemplatesScreen.tsx` zeigt den Stand vor T-186: kein `beginCopy`, die
Rechnung `` `Kopie von ${dropHiddenCharacters(...)}` `` **zweimal**, kein `setCopyNameTouched`.
Testdatei probeweise gegen diesen `HEAD`-Stand gefahren (Arbeitsbaum kurzzeitig ersetzt,
`md5sum` vor/nach Wiederherstellung gleich): **alle vier Fälle rot** — `beginCopy` nicht gefunden,
`onCopy={beginCopy}` nicht gefunden, kein Aufruf `beginCopy(shown)`, zwei statt eine Fundstelle
der Rechnung.

---

## 3. Welle-AC-Bausteine — vier Live-Regionen, gemessen gegen den heutigen Stand

T-186 Abschnitt 7.2(c) meldete drei Live-Regionen mit `role="status"` ohne die O-FX-Bauart plus
eine vierte (`TemplateFields.tsx`) ganz ohne Rolle. Beim Nachsehen lagen alle vier bereits in der
von frontend-dev überarbeiteten Fassung vor (`git status`: alle vier `M`, Kommentare verweisen auf
„O-GQ, T-191" als bereits abgeschlossene Behebung — nicht mehr „wird gerade gebaut"). Gemessen
habe ich gegen **genau diesen Stand** (Commit-Basis `HEAD` plus die vier genannten unversionierten
Änderungen, Stand des Arbeitsverzeichnisses zum Zeitpunkt dieses Laufs, 2026-09-06 ca. 05:00 Uhr).

### 3.1 Die Regel, listenfrei (nach Vorschlag N10 aus T-186)

> Das Element, das `role="alert"` oder `role="status"` trägt, darf nicht selbst der Zweig eines
> bedingten Ausdrucks sein, der über sein Entstehen entscheidet.

Ein allgemeiner, dateiunabhängiger Wächter dieser Art gehört nach T-186 N10 in
`apps/web/scripts/proof-foreign.mjs` (frontend-dev). Ich habe die Probe stattdessen **gezielt auf
die vier gemeldeten Flächen** angewandt — das ist innerhalb meiner Hoheit (`apps/web/test/**`) und
mißt genau den gemeldeten Befund, ohne die Wächter-Entscheidung vorwegzunehmen.

### 3.2 Ergebnis je Datei

| Datei | Fundstelle | Vorher (`HEAD`) | Jetzt |
|---|---|---|---|
| `SettingsScreen.tsx` | `<p className="field__error" role="status">` | ganze `<p>` im wahren Zweig von `{blocked ? (…) : null}` | `<p>` unbedingt, nur ihr Text bedingt |
| `ExportDirectorySection.tsx` | dieselbe Klasse, Musterseite | dasselbe Muster | dasselbe wie links |
| `ExportDirectoryField.tsx` | `<div className="field__live" role="alert">` | der bedingte `<p>` trug **gar keine** Rolle | neuer, unbedingter Behälter trägt die Rolle, der `<p>` bleibt bedingt darin |
| `TemplateFields.tsx` | `<div role="alert">` (keine eigene Klasse) | ebenso ohne Rolle | ebenso: unbedingter Behälter außen, bedingter Absatz innen |

### 3.3 Rot-vor-Grün, gegen den committeten Stand

Alle vier Quelldateien einzeln durch `git show HEAD:<Pfad>` ersetzt, Testlauf gefahren, danach aus
Sicherungskopien exakt wiederhergestellt (`md5sum` vor Ersatz = `md5sum` nach Wiederherstellung,
für jede der vier Dateien einzeln geprüft). Ergebnis: **alle vier Fälle rot** gegen `HEAD` — zwei
mit `expected true to be false` (Element existenzbedingt), zwei mit `expected [] to have a length
of 1 but got +0` (keine Rolle vorhanden). Gegen den heutigen Stand: alle vier grün.

### 3.4 `proof:shell-surface` / Rust-Bindung — geprüft, nicht angefaßt

`apps/desktop/scripts/proof-shell-surface.mjs` und `apps/desktop/src-tauri/src/lib.rs` sind in
dieser Welle verändert (neue `OPEN_CALL_SITES`-Liste, `mod attachment;`). Beides ist Skript- bzw.
Registrierungscode, kein `apps/*/test/**` und kein `#[cfg(test)]`-Block — außerhalb meiner Hoheit
für diese Aufgabe. `apps/desktop/src-tauri/src/attachment.rs` (neu, `??` in `git status`) trägt
bereits vier `#[cfg(test)]`-Blöcke; sie stammen erkennbar aus einer früheren, hier nicht benannten
Aufgabe (Berichte zu Frist/Anhängen existieren bereits unter anderen Nummern) und sind nicht Teil
dieses Auftrags. Ich habe dort nichts ergänzt, um nicht in eine Aufgabe hineinzuschreiben, die mir
nicht zugewiesen wurde. `release.rs` und `Cargo.toml` (Abhängigkeit `url = "2"`) sind ebenfalls
unverändert bzw. nur um die Abhängigkeit ergänzt — kein neuer, ungetesteter Prüfausdruck darin.

---

## 4. Ein Nebenbefund an der eigenen Arbeit

Der erste Lauf von `templatesScreenBeginCopy.test.ts` scheiterte mit
`Cannot find package 'jsdom'` — nicht wegen `jsdom`-Bedarfs, sondern weil mein eigener
Kopfkommentar die Zeichenfolge „`@vitest-environment jsdom`" als Fließtext enthielt. Vitest sucht
diese Kennzeichnung in der **gesamten** Datei, unabhängig von Kommentar oder Code, und versucht
dann, die (hier nicht installierte) `jsdom`-Umgebung zu laden — der Lauf bricht mit einem
Lademodulfehler ab, nicht mit einem roten Fall. Behoben durch Umformulierung ohne die exakte
Zeichenfolge. Für den Bestand relevant, falls künftig jemand über dieselbe Kennzeichnung in
Prosa stolpert — kein Eintrag in `proof:*` vorgeschlagen, weil der Fall selten und die Behebung
trivial ist, sobald man ihn kennt.

---

## 5. Nachweise

| Lauf | Vorher (Stand T-186-Bericht) | Nachher |
|---|---|---|
| `pnpm test` | 73 Dateien, 1442 Prüffälle, alle grün | **76 Dateien, 1456 Prüffälle, alle grün** (+3 Dateien, +14 Fälle: 5 + 5 + 4) |
| `pnpm typecheck` | 0 | **0** (unverändert, alle Pakete inkl. `typecheck:test`, `typecheck:e2e`) |
| `cargo test --lib` | — | **nicht gefahren** — kein Rust-Produktivcode in meiner Hoheit angefaßt (Abschnitt 3.4) |
| Rot-vor-Grün `touched.test.ts` | — | zwei Mutationen (siehe 1.2), je genau ein Fall rot, Rest grün |
| Rot-vor-Grün `templatesScreenBeginCopy.test.ts` | — | gegen `HEAD`-Vorzustand: 4/4 rot (siehe 2.3) |
| Rot-vor-Grün `liveRegionsAlwaysRendered.test.ts` | — | gegen `HEAD`-Vorzustand: 4/4 rot (siehe 3.3) |
| `git status` nach allen Rückbauten | — | Prüfsummen vor/nach jedem temporären Rückbau identisch; kein Produktivcode im endgültigen Diff |

`pnpm run proof:all` **nicht gefahren** (E-083 Punkt 3, ausdrücklich untersagt für diese Aufgabe).

---

## 6. Artefakte

**Neu (alle unter meiner Hoheit `apps/*/test/**`):**

```
apps/web/test/lib/touched.test.ts                       O-GS, fünf Fälle zu Regel P-8
apps/web/test/screens/templatesScreenBeginCopy.test.ts  O-GR, TemplatesScreen.beginCopy
apps/web/test/components/liveRegionsAlwaysRendered.test.ts  vier Live-Regionen (O-GQ/T-191)
```

**Nicht angefaßt:** jeder Produktivcode. Belegt durch `git status` (nach allen temporären
Rückbau-Läufen unverändert gegenüber dem Stand vor dieser Aufgabe) und durch `md5sum`-Vergleiche
vor/nach jedem der vier temporären Rückbauten (`touched.ts`, `TemplatesScreen.tsx`,
`SettingsScreen.tsx`, `ExportDirectorySection.tsx`, `ExportDirectoryField.tsx`,
`TemplateFields.tsx`).

---

## 7. Annahmen

1. **Fall 4 in Abschnitt 1 folgt der dokumentierten Regel (P-8, `touched.ts`-Kopfkommentar), nicht
   der Kurzfassung im Auftragstext.** Beide führen zum selben sichtbaren Verhalten; nur eine ist
   der tatsächliche Rückgabewert der geprüften Funktion. Siehe Abschnitt 1.1 und „Offene Fragen".
2. **Kein allgemeiner Wächter für die Live-Region-Bauart gebaut.** T-186 N10 schlägt ihn für
   `proof-foreign.mjs` vor (frontend-dev-Hoheit); ich habe die Probe gezielt auf die vier
   gemeldeten Flächen angewandt, nicht als neuen, unabhängig zu wartenden Prüfpfad.
3. **`attachment.rs` nicht anfaßt.** Vier `#[cfg(test)]`-Blöcke stehen dort bereits; sie sind
   nicht Teil des mir zugewiesenen Umfangs dieser Welle (T-193 nennt nur die vier Live-Regionen
   und `proof:shell-surface`).
4. **Fünfter Fall bei `touched.ts` (kein `trim()`) ergänzt**, obwohl der Auftrag vier nennt — er
   sichert eine im Quelltext explizit benannte Entscheidung, die sonst ungemessen bliebe, und
   bleibt innerhalb „vier bis sechs".

---

## 8. Risiken

1. **Die Abweichung in Fall 4 (Abschnitt 1.1) ist ein echter Interpretationsunterschied**, kein
   Schreibfehler meinerseits — wenn die Kurzfassung im Auftrag die eigentlich gewollte Regel war
   (nicht nur eine ungenaue Paraphrase des sichtbaren Verhaltens), ist stattdessen `touched.ts`
   selbst zu ändern, und das ist Produktivcode.
2. **Die AST-Prüfungen in `templatesScreenBeginCopy.test.ts` und `liveRegionsAlwaysRendered.test.ts`
   sind strukturell, nicht laufzeitbasiert.** Sie messen, daß der Quelltext die behauptete Form
   hat (eine Funktion statt zwei, ein unbedingtes Element statt eines bedingten) — nicht, daß eine
   Vorlesehilfe die Region tatsächlich ansagt. Diese Lücke bestand schon vor dieser Aufgabe (siehe
   T-186 Abschnitt 1, „das ist heute e2e-Arbeit und nicht Einheitsarbeit").
3. **Kein `jsdom`/`@testing-library/react` im Bestand.** Jede künftige Aufgabe, die eine
   gerenderte Komponente unter Vitest prüfen will, braucht zuerst eine `package.json`-Entscheidung
   des Orchestrators.

---

## 9. Offene Fragen

1. **An den Orchestrator, wegen Abschnitt 1.1:** Case 4 aus dem Auftrag („vorbelegtes Feld,
   unverändert verlassen → nicht angefaßt") widerspricht dem wörtlichen P-8 („... oder nicht leer
   ist", verbindlich seit T-184 Z-20) und dem heutigen Quelltext von `touched.ts`. Ist die
   Kurzfassung im Auftrag eine Paraphrase des sichtbaren Verhaltens (keine Meldung, weil der Wert
   nicht leer ist — dann ist mein Test korrekt und nichts zu ändern), oder war „nicht angefaßt"
   wörtlich gemeint (dann müßte `touchedOnBlur` selbst die zweite Hälfte verlieren — eine
   Produktivcode-Änderung mit Folgen für alle neun Aufrufstellen)?
2. **An frontend-dev, zur Kenntnis:** T-186 Abschnitt 7.2(c) und N10 sind mit dem heutigen Stand
   erledigt (Abschnitt 3 dieses Berichts) — die vier Flächen sind sowohl mit Rolle als auch
   unbedingt gebaut. Der in N10 vorgeschlagene allgemeine Wächter in `proof-foreign.mjs` steht
   weiter aus, ist aber nicht mehr durch vier bekannte, unbehobene Fälle gedeckt, sondern eine
   reine Vorwärtsmaßnahme gegen den nächsten Baustein.

---

## 10. Nächster Schritt

1. **Orchestrator:** Frage 1 aus Abschnitt 9 entscheiden — sie entscheidet, ob `touched.ts` einen
   weiteren Auftrag braucht.
2. **frontend-dev / Orchestrator:** den in T-186 N10 vorgeschlagenen allgemeinen Wächter
   („role=alert/status nicht als Zweig eines bedingten Ausdrucks") als eigenen, dateiunabhängigen
   Abschnitt in `proof-foreign.mjs` einordnen, falls gewünscht — die drei gezielten Fälle aus
   Abschnitt 3 dieses Berichts ersetzen ihn nicht, sie ergänzen ihn nur für vier heute bekannte
   Stellen.
3. **e2e-tester:** die in T-186 Abschnitt 1 vorgeschlagene Browser-Messung für die Ansage der
   vier Live-Regionen (nicht nur ihre Bauart) bleibt offen — dieselbe Lücke wie beim Notizfeld.
