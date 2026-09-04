# T-111 — Tests für Welle G

Aufgabe: T-111 — Tests für Welle G
Status: fertig

---

## Artefakte

### Geändert

| Datei | Was |
|---|---|
| `packages/storage/test/mappers.test.ts` | Punkt 1: `poolReference`-Erwartung um `name: 'Abrechnung'` ergänzt (behebt das von T-107 gemeldete Rot); neuer Fall „der vollständige Vertrag" (`field`, `code: 'pool_rule'`, `name`, `message`, kein fünftes Feld, `name` nie leer) |
| `packages/domain/test/board.test.ts` | Punkt 5 (W-13): Kopfkommentar Zeile 12–17 „Regel über Tags" → „Regel mit fünf Achsen (E-055: erforderliche Tags, ausgeschlossene Tags, Status, Erledigt, Exportstatus)" |
| `apps/web/test/lib/errorText.test.ts` | Punkt 3: neuer Helfer `poolReferenceDetailWithName`; neue `describe`-Gruppe „errorMessageWithRules — details[].name (T-110-Vertrag aus T-107, W-11)" mit fünf Fällen (ein Name, drei Namen, zwei Namen, kein Name = unverändert, fremder `code` bleibt außen vor) |
| `apps/local-api/test/http/input.test.ts` | Punkt 6 (T-112-H2, Sicherheitsbefund): die vierzehn roh im Quelltext stehenden Steuer- und Bidi-Zeichen (`U+0000`, `U+0007` ×3, `U+001F`, `U+007F`, `U+009F`, `U+202A`, `U+202E` ×2, `U+2065`, `U+2066`, `U+2069`, `U+206A`) durch `\uXXXX`-Escapes ersetzt. Keine Verhaltensänderung — dieselben 22 Prüffälle, dieselben Codepunkte, nur als Text statt als Byte |

### Neu

| Datei | Fälle | Was |
|---|---|---|
| `apps/local-api/test/usecases/time-entry-movement.test.ts` | 4 | Punkt 2: `createTimeEntry` gegen eine `AppContext`/`UnitOfWork`-Attrappe — offenes Todo ohne Buchung (Bewegung, `list('all')` genau einmal), offenes Todo mit bestehender offener Buchung (`null`, keine Regelauflösung), **erledigtes** Todo (Bewegung, „Erledigt" bleibt gesetzt — der belegte Unterschied zwischen `closedEntryMovementStates` und `bookingMovementStates`), Fehlschlag beim Anlegen (Fehler geht durch, keine Regelauflösung) |
| `apps/web/test/lib/labels.test.ts` | 13 | Punkt 3: `poolPlacementMessage` — sechs reine Kombinationen (drei Anzeigeorte × `restored`), die vier im T-108-Bericht gemessenen Handlungs-/Rückweg-Paare, zwei weitere Eigenschaften; `reactivationTitle` — drei Fälle |
| `apps/local-api/test/routes/addin/service.test.ts` | 6 | Punkt 4: `findMatches`/`bookOnTodo` gegen eine `AddinDeps`/`AddinUnit`-Attrappe — `null` bei offenem Todo mit bestehender offener Buchung (ohne Regelauflösung), drei leere Listen bei erledigtem Todo ohne Treffer (TP-EXPST-12), Schlüsselvergleich an Treffer und Buchungsantwort (keine Reste `poolNames`/`enteringPoolNames`/`leavingPoolNames`) |

29 neue Prüffälle insgesamt (758 → 787), dieselbe Zahl auch nach Punkt 6 (reine Zeichendarstellung, keine neuen/entfernten Fälle). Nichts außerhalb von `packages/*/test/**` und `apps/*/test/**` angefasst.

---

## Zusammenfassung

Alle fünf Punkte des Auftrags sind umgesetzt. Der von T-107 gemeldete rote Test ist behoben und um den vollständigen `TaktFieldError`-Vertrag ergänzt; `createTimeEntry` und die beiden Add-in-Routen sind erstmals als Einheitentest abgedeckt (bislang nur im Dienstdurchlauf bzw. gar nicht gemessen) und belegen insbesondere die feine Stelle aus T-107 Offener Frage 1: Eine Buchung von Hand auf ein erledigtes Todo hebt „Erledigt" **nicht** auf, und `poolMovement` weist deshalb keine verlassene `completion: 'done'`-Spalte aus. `poolPlacementMessage`/`reactivationTitle` sind vollständig geprüft, und `errorMessageWithRules` ist gegen den `details[].name`-Vertrag aus T-107 getestet — diese drei Fälle waren zum Zeitpunkt des Schreibens rot (T-110 war noch nicht im Baum), sind aber während dieser Aufgabe von frontend-dev parallel nachgezogen worden und beim abschließenden Lauf grün (siehe „Nachweis (Endstand)"). `ToastContext.evict()` konnte **nicht** geprüft werden — siehe Risiken/Offene Fragen, das ist eine Blockade und keine Lücke, die ich stillschweigend übergehe. Dazu Punkt 6, ein Sicherheitsbefund (T-112-H2), außerhalb der ursprünglichen fünf Punkte: `apps/local-api/test/http/input.test.ts` (T-105) trug vierzehn rohe Steuer- und Bidi-Zeichen im Quelltext, darunter ein NUL, das die Datei für `git diff` binär machte und den Nachweis der eigenen Zeichenwache unlesbar. Behoben durch `\uXXXX`-Escapes, ohne Verhaltensänderung.

---

## Rotnachweis

### Punkt 1 — `mappers.test.ts` (der von T-107 gemeldete Fall)

```
$ pnpm exec vitest run packages/storage/test/mappers.test.ts   # VOR der Änderung
 ❯ poolReference … bildet { id, name } auf { field, code: "pool_rule", message: 'Regel „…“' } ab
AssertionError: expected { field: 'pool-1', …(3) } to deeply equal { field: 'pool-1', …(2) }
+   "name": "Abrechnung",
 Test Files  1 failed (1)
      Tests  1 failed | 33 passed (34)
```
Nach Ergänzung um `name: 'Abrechnung'` und dem zweiten Fall: `35 passed (35)`.

### Punkt 2 — `time-entry-movement.test.ts`

Bewusst falsche Erwartung im Fall „erledigtes Todo" (`leaves: ['Erledigt']` statt `[]` — genau der Fehler, den `bookingMovementStates` anstelle von `closedEntryMovementStates` erzeugt hätte):

```
❯ ein ERLEDIGTES Todo: … 6ms
AssertionError: expected { …(3) } to deeply equal { …(3) }
-   "leaves": ["Erledigt"],
+   "leaves": [],
 Tests  1 failed | 3 passed (4)
```
Zurückgestellt: `4 passed (4)`.

### Punkt 3 — `labels.test.ts`

Bewusst falsche Erwartung (`board`-Kurzform statt `Pool und Board` bei `placement: 'both'`):

```
❯ placement "both", restored false: … 4ms
AssertionError: expected '„Ost“ — Pool und Board. …' to be '„Ost“ — Board-Spalte. …'
 Tests  1 failed | 12 passed (13)
```
Zurückgestellt: `13 passed (13)`.

### Punkt 3 — `errorText.test.ts` (`details[].name`)

Beim Schreiben lief `errorText.ts` noch mit der alten Fassung (kein `name`-Zugriff). Gemessen **vor** dem parallelen Nachzug durch frontend-dev:

```
❯ genau ein Eintrag MIT name: … 4ms
AssertionError: expected 'Dieser Ordner wird in der Regel eines…' to be 'Dieser Ordner wird in der Regel eines…'
Expected: "… Betroffen ist die Regel „Ost“."
Received: "… Betroffen ist Regel „Ost“."
❯ drei Einträge MIT name: … 1ms
❯ zwei Einträge MIT name: … 0ms
 Tests  3 failed | 24 passed (27)
```
Betroffene Fälle: „genau ein Eintrag MIT name", „drei Einträge MIT name", „zwei Einträge MIT name". Der Fall „ein Eintrag OHNE name" war und blieb grün (unveränderter Vertrag). Beim abschließenden Gesamtlauf (nach T-110) sind alle 27 grün — siehe Nachweis unten.

### Punkt 4 — `service.test.ts`

Bewusst vertauschte Erwartung (`null` statt drei leerer Listen für den „Kein Treffer"-Fall — genau die beiden Bedeutungen, die T-104 auseinanderhält):

```
❯ erledigtes Todo OHNE jeden Treffer: … 5ms
AssertionError: expected { appears: [], enters: [], leaves: [] } to be null
 Tests  1 failed | 5 passed (6)
```
Zurückgestellt: `6 passed (6)`.

Punkt 5 (W-13 in `board.test.ts`) ist eine reine Kommentarkorrektur ohne Prüflogik — dafür gibt es keinen Rot-Zustand zu belegen, nur die Bestätigung, dass die Datei nach der Änderung weiter grün läuft (`12 passed (12)`).

### Punkt 6 — `input.test.ts` (T-112-H2, Sicherheitsbefund, kein TDD-Fall)

Kein Rot-vor-Grün-Nachweis hier: Es ist keine neue Anforderung, sondern eine reine Zeichendarstellung — dieselben 22 Fälle, derselbe Vertrag, nur ohne rohe Bytes im Quelltext. Vorher/Nachher-Beleg stattdessen über die Datei selbst und einen vollständigen Codepunkt-Scan:

```
$ file apps/local-api/test/http/input.test.ts        # VOR der Änderung
apps/local-api/test/http/input.test.ts: data

$ file apps/local-api/test/http/input.test.ts        # NACH der Änderung
apps/local-api/test/http/input.test.ts: JavaScript source, Unicode text, UTF-8 text
```

Codepunkt-Scan (C0/C1, `U+202A`–`U+202E`, `U+2065`–`U+206F`) über die ganze Datei nach der Änderung: **keine Treffer**. Vorher waren es vierzehn, an den Zeilen 60, 70, 87, 92, 109, 114, 126, 131, 136, 141, 148 (×2 in derselben Zeile), 158, 164 — deckungsgleich mit den von T-112 genannten Fundstellen (`:60`, `:109`, `:114`, `:131`, `:136` unter anderem). Jede Zeile wurde einzeln durch ihre Escape-Fassung ersetzt (z. B. `'Vor Nach'` statt des rohen NUL zwischen „Vor" und „Nach"), keine Zeile inhaltlich sonst verändert. `pnpm exec vitest run apps/local-api/test/http/input.test.ts` bleibt bei `22 passed (22)` — davor und danach identisch.

`git diff` zeigt für diese Datei weiterhin `Bin … bytes` an, weil die **alte**, bereits im Baum stehende Fassung (mit dem rohen NUL) die Vergleichsseite ist — das legt sich, sobald der Stand committet ist und künftige Diffs gegen die neue, NUL-freie Fassung laufen. Das war laut Befund auch der Punkt: Der **neue** Stand bleibt Text, nicht dass der aktuelle Arbeitsbaum-Diff gegen den alten Commit es rückwirkend wird.

---

## Nachweis (Endstand)

| Befehl | Endstatus | Ergebnis |
|---|---|---|
| `pnpm run typecheck:test` | **0** | sechs Testkonfigurationen |
| `pnpm run typecheck` | **0** | acht Pakete, `typecheck:test`, `typecheck:e2e` — die von T-107 gemeldete fremde Rotstelle (`apps/web/src/showcase/BoardSection.tsx`) ist inzwischen (parallele Welle) behoben, nicht von mir |
| `pnpm run test` | **0** | 53 Testdateien, **787 Prüfungen** (758 → 787, +29) |
| `pnpm run test:coverage` | **0** | siehe Tabelle unten — alle drei Schwellen (`packages/domain/src`, `packages/storage/src`, `packages/export/src`, je 80 %) gehalten |

Alle vier Läufe sind **nach** der Behebung von Punkt 6 (T-112-H2) ein zweites Mal gefahren — identische Endstände und identische Zahlen wie zuvor (787 Tests, dieselbe Abdeckung), siehe Tabelle unten. Zusätzlich isoliert erneut geprüft, weil frontend-dev laut Orchestrator-Hinweis parallel wieder an `apps/web/src/lib/errorText.ts` arbeitet: `pnpm exec vitest run apps/web/test/lib/errorText.test.ts` — **27 von 27 grün** zum Zeitpunkt dieses Berichts. Kein Fall dort ist aktuell rot; sollte sich der Wortlaut („die Regel"/„die Regeln") bis zur Abnahme noch einmal ändern, sind die drei betroffenen Fälle in der Datei namentlich benannt (siehe Rotnachweis Punkt 3 und Risiko 3 unten) und leicht wiederzufinden.

**Abdeckung (Gesamtdatei, `v8`):**

| | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| gesamt | 91,22 % | 84,51 % | 94,19 % | 93,84 % |
| `packages/domain/src` | 89,93 % | 88,42 % | 91,8 % | 90,15 % |
| `packages/export/src` | 97,95 % | 92,26 % | 100 % | 97,82 % |
| `packages/storage/src` (inkl. `sqlite/`) | ~90,3 % | ~81,8 % | ~94,2 % | ~93,8 % |

Die Zahlen sind identisch mit dem in T-105 gemessenen Stand (84,51 % Zweige gesamt): Meine neun geänderten/neuen Dateien liegen in `apps/local-api/test/**` und `apps/web/test/**`, außerhalb von `coverage.include` (`vitest.config.ts`) — nur `mappers.test.ts` berührt eine erfasste Datei, und `mappers.ts` stand dort bereits bei 100 %. Kein Wert ist gefallen.

`pnpm run proof:all`/`pnpm run boundaries` habe ich **nicht** laufen lassen: Sie binden Port 17843/17844, die laut Auftrag gerade einem vollen `test:e2e`-Lauf des Orchestrators gehören, und die Aufgabe verlangt sie unter „Nachweis" nicht. Kein Prozess wurde von mir beendet.

---

## Annahmen

1. **`createTimeEntry` (Punkt 2) prüft die Verdrahtung, nicht die reine Rechnung.** `bookingMovementStates`/`closedEntryMovementStates` selbst sind bereits in `pool-movement-states.test.ts` (T-105) gegeneinander abgegrenzt. Diese Datei prüft, dass `createTimeEntry` tatsächlich `movementOfBooking` (und damit `closedEntryMovementStates`) ruft und nicht `bookingMovementStates` — exakt der Punkt aus T-107s Offener Frage 1, die der Orchestrator mit (A) beantwortet hat (`decisions.md`, Nachtrag zu E-061, letzter Satz). Attrappe nach dem Muster aus `todo-done-movement.test.ts`: nur die tatsächlich gelesenen Ports (`todos.load`, `timeEntries.exportPresence`+`create`, `pools.list`+`resolveAxes`).
2. **Zwei Regel-Fixturen genügen, um die beiden Achsen (Exportstatus/Erledigt) auseinanderzuhalten** (`time-entry-movement.test.ts`, `service.test.ts`): eine Regel, die ausschließlich nach `exportState` fragt („Abrechnung"), eine, die ausschließlich nach `completion` fragt („Erledigt"). Damit zeigt der Test unmittelbar, welche Achse sich bewegt und welche nicht — mit einer einzigen, alles-oder-nichts-Regel wäre der Unterschied zwischen den beiden Rechnungen nicht sichtbar gewesen.
3. **`poolPlacementMessage`s dritter Parameter (`restored`) beeinflusst nur den Titel, nicht die Zeile — das musste ich am Quelltext klären, nicht raten.** Mein erster Entwurf nahm irrtümlich an, ein Rückweg zeige die Kurzform des *ursprünglichen* Zustands unter demselben `placement`-Argument; das ist falsch, `body` hängt ausschließlich an `placement`. Nach Lektüre von `labels.ts:209-218` sind die sechs reinen Kombinationen jetzt direkt gegen die Implementierung geschrieben und zusätzlich an den vier realistischen Handlungs-/Rückweg-Paaren aus dem T-108-Bericht gegengeprüft (unterschiedliche `placement`-Werte für Handlung und Rückweg).
4. **`errorMessageWithRules`-Tests mit `name` sind bewusst nicht abgeschwächt**, obwohl sie beim Schreiben rot waren (T-110 noch nicht im Baum). Das ist wörtlich die Anweisung aus dem Auftrag. Dass sie beim Abschluss der Aufgabe grün sind, liegt an einem parallelen Commit von frontend-dev während meiner Arbeit — Zufall der Zeitüberschneidung, kein Verdienst dieser Aufgabe. Der Rotnachweis oben ist deshalb mit Zeitstempel-Kontext dokumentiert, nicht nachträglich geglättet.
5. **`ApiFieldError.name` brauchte keinen Typ-Workaround.** Als ich die Tests entwarf, hatte `apps/web/src/api/types.ts` (fremde Hoheit) das Feld noch nicht; während der Arbeit landete es dort (ebenfalls T-110, parallel). Ich habe die Tests nicht vorab mit einem `as`-Cast gegen den alten Typ abgesichert, weil das Feld zum Zeitpunkt des Fertigstellens bereits Teil des Typs war — nachprüfbar am jetzigen Diff, der keine Cast-Konstrukte enthält.
6. **`service.test.ts` liegt unter `apps/local-api/test/routes/addin/`**, einem bislang leeren Testordner (parallel zu `apps/local-api/src/routes/addin/**`, Hoheit integration-dev — die Testdatei selbst gehört laut Hoheitstabelle weiterhin mir, `apps/*/test/**`). Kein Konflikt: integration-dev hat laut T-104-Bericht keine eigene Testdatei dort angelegt.
7. **Keine Testdaten mit echten Call-Nummern.** `TCK-4711` in `service.test.ts` ist erfunden, wie `TCK-…` bereits in T-104s eigenen Nachweisen.
8. **Punkt 6 ersetzt Zeile für Zeile, statt die Datei umzuschreiben.** Ich habe die vierzehn betroffenen Zeilen einzeln durch ihre `\uXXXX`-Fassung ersetzt (per Skript, weil die unsichtbaren Zeichen sich nicht zuverlässig als Suchtext eintippen lassen) und keine Prosa, keinen Testtitel und keine Struktur der Datei sonst verändert — der Befund T-112-H2 verlangt Lesbarkeit, keine Überarbeitung.

---

## Risiken

1. **`ToastContext.evict()` ist NICHT geprüft — Blockade, siehe Offene Frage 1.** `evict` ist eine private, nicht exportierte Funktion in einer `.tsx`-Datei, die React-Hooks (`useState`, `useEffect`, `useRef`) nutzt. Der Arbeitsbereich hat weder `jsdom` noch `@testing-library/react`/`react-test-renderer` installiert (`node_modules` geprüft, keine Spur), und `vitest.config.ts` läuft in der Voreinstellung mit `environment: 'node'`. T-108 selbst hat dieselbe Regel „im Browser gegen den echten Baustein gemessen, nicht behauptet" (gebauter Showcase mit `esbuild`), nicht mit Vitest — ein Indiz, dass zum Zeitpunkt von T-108 kein Rahmen dafür bestand. Ich habe weder Produktivcode angefasst (kein Export von `evict`) noch `package.json` geändert (Hoheit des Orchestrators) — beides wäre nötig, um diesen Fall zu prüfen.
2. **Sicherheit: keine neue Fläche.** Alle neuen Tests laufen unter `test/`, rufen ausschließlich bereits vorhandene, exportierte Funktionen/Anwendungsfälle auf und verwenden ausschließlich erfundene Namen (Ost, Nord, Abrechnung, Wartung Nord, TCK-4711, „Testtodo aus dem Add-in"). Keine echten Call-Nummern, Kundennamen oder Zugangsdaten.
3. **`errorText.test.ts` hängt jetzt an einem Feld (`ApiFieldError.name`), das während dieser Aufgabe von einer parallel arbeitenden Rolle eingeführt wurde.** Sollte T-110 die Wortwahl noch ändern („die Regel"/„die Regeln" ist mein Verständnis des Auftragstexts, wortwörtlich übernommen), werden genau diese drei Fälle wieder rot — das ist beabsichtigt und keine Überkopplung: Der Auftrag zu T-111 gibt den Wortlaut exakt vor.

---

## Offene Fragen

1. **`ToastContext.evict()` — braucht einen Rahmen für React-Bausteine, den es heute nicht gibt.** T-108 hat dieselbe Lücke im eigenen Bericht benannt („Dazu die Regel aus `ToastContext.evict`, falls ein Rahmen für React-Bausteine eingerichtet wird"). Möglichkeiten für den Orchestrator: (a) `jsdom` und `@testing-library/react` als Entwicklungsabhängigkeiten aufnehmen (`package.json`, Hoheit Orchestrator) — dann kann ich `evict()` über `ToastProvider`/`useToasts` prüfen; (b) `evict` als benannten Export aus `ToastContext.tsx` freigeben (Hoheit frontend-dev), dann ließe sich die Funktion rein — ohne DOM — prüfen, da sie selbst nur auf einem Array von `Toast`-Objekten rechnet; (c) die fünf im T-108-Bericht bereits im Browser gemessenen Erwartungen als ausreichenden Nachweis akzeptieren und hier bewusst auslassen. Ich habe nicht geraten und stattdessen nichts geschrieben, statt einen Test zu bauen, der entweder Produktivcode ändert oder eine Abhängigkeit voraussetzt, die nicht da ist.
2. **Der genaue Wortlaut „Betroffen ist die Regel"/„Betroffen sind die Regeln"** ist wörtlich aus der Aufgabenbeschreibung zu T-111 übernommen; sollte spec-ux-reviewer ihn abweichend abnehmen, sind die drei zugehörigen Fälle in `errorText.test.ts` die Stelle, die nachgezogen werden muss.

---

## Nächster Schritt

1. **Orchestrator:** Offene Frage 1 entscheiden (Testrahmen für React-Bausteine ja/nein, und wenn ja, welcher). Ohne Entscheidung bleibt `ToastContext.evict()` ungeprüft durch Vitest.
2. **frontend-dev:** Falls (b) aus Offener Frage 1 gewählt wird — `evict` als benannten, aber weiterhin internen Export markieren (z. B. `export const evict` statt `function evict`) —, melde ich mich mit einem reinen Funktionstest nach, ohne DOM.
3. **security-checker:** T-112-H2 ist erledigt (`apps/local-api/test/http/input.test.ts` ist jetzt Text, `file` bestätigt UTF-8, kein roher Codepunkt mehr im Bestand) — zur Gegenprüfung im nächsten Durchlauf.
4. **Reviewer-Wiedervorlage:** Die neuen Dateien zusammen mit T-107/T-108/T-104 prüfen — sie hängen an denselben Verträgen (`poolMovement`, `TaktFieldError.name`).
